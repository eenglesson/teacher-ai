'use client';
import { useMemo, useState, useEffect } from 'react';
import { formatName } from '@/app/utils/formatName';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Tables } from '@/database.types';

// Define component props
interface PopoverListStudentsProps {
  students: Tables<'students'>[];
  onSelect: (selectedStudents: Tables<'students'>[]) => void;
}

export default function PopoverListStudents({
  students,
  onSelect,
}: PopoverListStudentsProps) {
  // State to track selected student IDs
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Group students by school_year using useMemo
  const groupedStudents = useMemo(() => {
    const groups = students.reduce((acc, student) => {
      const year = student.school_year || 'Unknown';
      if (!acc[year]) {
        acc[year] = { school_year: year, students: [] };
      }
      acc[year].students.push(student);
      return acc;
    }, {} as Record<string, { school_year: string; students: Tables<'students'>[] }>);

    return Object.values(groups).sort((a, b) =>
      a.school_year.localeCompare(b.school_year)
    );
  }, [students]);

  // Handle individual student selection
  const onToggleStudent = (student: Tables<'students'>) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(student.id)) {
        newSet.delete(student.id);
      } else {
        newSet.add(student.id);
      }
      return newSet;
    });
  };

  // Handle class selection (select/deselect all students in a class)
  const onToggleClass = (schoolYear: string) => {
    const classStudents = groupedStudents.find(
      (group) => group.school_year === schoolYear
    )?.students;

    if (!classStudents) return;

    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      const allSelected = classStudents.every((student) =>
        newSet.has(student.id)
      );

      if (allSelected) {
        // Deselect all students in the class
        classStudents.forEach((student) => newSet.delete(student.id));
      } else {
        // Select all students in the class
        classStudents.forEach((student) => newSet.add(student.id));
      }
      return newSet;
    });
  };

  // Notify parent component of selection changes
  useEffect(() => {
    const selectedStudents = students.filter((student) =>
      selectedIds.has(student.id)
    );
    onSelect(selectedStudents);
  }, [selectedIds, students, onSelect]);

  // Button text based on selection count
  const buttonText =
    selectedIds.size === 0
      ? 'Choose Student'
      : selectedIds.size === 1
      ? '1 Student Selected'
      : `${selectedIds.size} Students Selected`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' className='w-[160px]'>
          {buttonText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-72 h-64 overflow-auto p-0'>
        <div className='flex flex-col'>
          <h1 className='sticky top-0 font-medium bg-white z-10 p-2 text-center border-b shadow-sm'>
            Select Students
          </h1>
          <Accordion type='multiple' className='w-full px-2'>
            {groupedStudents.map((group) => {
              const allSelected = group.students.every((student) =>
                selectedIds.has(student.id)
              );
              const someSelected = group.students.some((student) =>
                selectedIds.has(student.id)
              );

              return (
                <AccordionItem
                  key={group.school_year}
                  value={group.school_year}
                  className='w-full'
                >
                  <div className='flex items-center gap-2 w-full'>
                    <Checkbox
                      checked={
                        allSelected
                          ? true
                          : someSelected
                          ? 'indeterminate'
                          : false
                      }
                      onCheckedChange={() => onToggleClass(group.school_year)}
                    />
                    <AccordionTrigger className='flex flex-1 items-center justify-between hover:no-underline hover:bg-accent py-1 my-1 px-2'>
                      <div className='flex items-center gap-2'>
                        <p className='text-body'>
                          Class{' '}
                          {formatName(group.school_year, {
                            capitalizeLastLetter: true,
                          })}
                        </p>
                      </div>
                    </AccordionTrigger>
                  </div>
                  <AccordionContent className='pb-3'>
                    <div className='ml-6 flex flex-col'>
                      {group.students.map((student) => (
                        <label
                          key={student.id}
                          className='flex items-center gap-2 p-1 cursor-default rounded-md hover:bg-accent'
                        >
                          <Checkbox
                            checked={selectedIds.has(student.id)}
                            onCheckedChange={() => onToggleStudent(student)}
                          />
                          <span>
                            {student.full_name
                              ? formatName(student.full_name)
                              : 'Unknown Student'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </PopoverContent>
    </Popover>
  );
}
